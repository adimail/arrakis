package org.adimail.arrakisbackend.inventory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.adimail.arrakisbackend.config.ShopifyClientConfig;
import org.adimail.arrakisbackend.inventory.dto.*;
import org.adimail.arrakisbackend.inventory.dto.InventoryDtos.*;
import org.adimail.arrakisbackend.inventory.model.InventoryLevel;
import org.adimail.arrakisbackend.inventory.model.Product;
import org.adimail.arrakisbackend.inventory.model.ProductVariant;
import org.adimail.arrakisbackend.inventory.model.StoreSetting;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Service
public class InventoryService {

    private static final String DEFAULT_THRESHOLD_KEY = "low_inventory_threshold";
    private static final String DEFAULT_THRESHOLD_VALUE = "10";

    private static final String GRAPHQL_PAGINATED_QUERY = """
        query($cursor: String) {
          products(first: 10, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              title
              vendor
              productType
              status
              featuredImage {
                url
              }
              variants(first: 10) {
                nodes {
                  id
                  title
                  sku
                  price
                  inventoryItem {
                    id
                    inventoryLevels(first: 5) {
                      nodes {
                        location {
                          id
                          name
                        }
                        quantities(names: ["available"]) {
                          name
                          quantity
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        """;

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryLevelRepository inventoryLevelRepository;
    private final StoreSettingRepository storeSettingRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ShopifyClientConfig shopifyConfig;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public InventoryService(ProductRepository productRepository,
                            ProductVariantRepository productVariantRepository,
                            InventoryLevelRepository inventoryLevelRepository,
                            StoreSettingRepository storeSettingRepository,
                            ApplicationEventPublisher eventPublisher,
                            ShopifyClientConfig shopifyConfig,
                            HttpClient httpClient,
                            ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.inventoryLevelRepository = inventoryLevelRepository;
        this.storeSettingRepository = storeSettingRepository;
        this.eventPublisher = eventPublisher;
        this.shopifyConfig = shopifyConfig;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    private String extractNumericId(String gidOrNumber) {
        if (gidOrNumber == null) {
            return null;
        }
        String trimmed = gidOrNumber.trim();
        int lastSlashIndex = trimmed.lastIndexOf('/');
        if (lastSlashIndex != -1 && lastSlashIndex < trimmed.length() - 1) {
            return trimmed.substring(lastSlashIndex + 1);
        }
        return trimmed;
    }

    @Transactional(readOnly = true)
    public int getLowInventoryThreshold() {
        return storeSettingRepository.findById(DEFAULT_THRESHOLD_KEY)
                .map(setting -> Integer.parseInt(setting.getValue()))
                .orElse(Integer.parseInt(DEFAULT_THRESHOLD_VALUE));
    }

    @Transactional
    public void setLowInventoryThreshold(int threshold) {
        StoreSetting setting = new StoreSetting(DEFAULT_THRESHOLD_KEY, String.valueOf(threshold));
        storeSettingRepository.save(setting);
    }

    @Transactional
    public int syncFromShopify() {
        try {
            Map<String, Integer> existingThresholds = new HashMap<>();
            List<ProductVariant> allExistingVariants = productVariantRepository.findAll();
            for (ProductVariant v : allExistingVariants) {
                if (v.getAlertThreshold() != null) {
                    existingThresholds.put(v.getId(), v.getAlertThreshold());
                }
            }

            List<Product> productsToSave = new ArrayList<>();
            Set<String> incomingProductIds = new HashSet<>();
            String cursor = null;
            boolean hasNextPage = true;

            while (hasNextPage) {
                Map<String, Object> requestPayload = new HashMap<>();
                requestPayload.put("query", GRAPHQL_PAGINATED_QUERY);
                Map<String, Object> variables = new HashMap<>();
                variables.put("cursor", cursor);
                requestPayload.put("variables", variables);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(shopifyConfig.getGraphQLEndpoint()))
                        .header("Content-Type", "application/json")
                        .header("X-Shopify-Access-Token", shopifyConfig.getAccessToken())
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestPayload)))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() != 200) {
                    throw new RuntimeException("Shopify API HTTP error: " + response.statusCode() + " - " + response.body());
                }

                JsonNode rootNode = objectMapper.readTree(response.body());
                if (rootNode.has("errors") && !rootNode.get("errors").isEmpty()) {
                    throw new RuntimeException("Shopify GraphQL error: " + rootNode.get("errors").toString());
                }

                if (!rootNode.has("data") || rootNode.get("data").isNull()) {
                    throw new RuntimeException("Shopify response missing data field: " + response.body());
                }

                ShopifyData.GraphQLResponse graphQLResponse = objectMapper.treeToValue(
                        rootNode,
                        ShopifyData.GraphQLResponse.class
                );

                if (graphQLResponse.data() == null || graphQLResponse.data().products() == null) {
                    throw new RuntimeException("Shopify response products connection is null: " + response.body());
                }

                ShopifyData.ProductConnection connection = graphQLResponse.data().products();
                for (ShopifyData.ProductNode pNode : connection.nodes()) {
                    incomingProductIds.add(pNode.id());
                    String imageUrl = pNode.featuredImage() != null ? pNode.featuredImage().url() : null;

                    Product product = new Product(
                            pNode.id(),
                            pNode.title(),
                            pNode.vendor(),
                            pNode.productType(),
                            pNode.status(),
                            imageUrl
                    );

                    if (pNode.variants() != null) {
                        for (ShopifyData.VariantNode vNode : pNode.variants().nodes()) {
                            ProductVariant variant = new ProductVariant(
                                    vNode.id(),
                                    vNode.title(),
                                    vNode.sku(),
                                    vNode.price()
                            );

                            if (vNode.inventoryItem() != null) {
                                variant.setInventoryItemId(extractNumericId(vNode.inventoryItem().id()));
                            }

                            if (existingThresholds.containsKey(vNode.id())) {
                                variant.setAlertThreshold(existingThresholds.get(vNode.id()));
                            }

                            if (vNode.inventoryItem() != null && vNode.inventoryItem().inventoryLevels() != null) {
                                for (ShopifyData.InventoryLevelNode lNode : vNode.inventoryItem().inventoryLevels().nodes()) {
                                    int available = 0;
                                    if (lNode.quantities() != null && !lNode.quantities().isEmpty()) {
                                        available = lNode.quantities().getFirst().quantity();
                                    }

                                    InventoryLevel level = new InventoryLevel(
                                            lNode.location().id(),
                                            lNode.location().name(),
                                            available
                                    );
                                    variant.addInventoryLevel(level);
                                }
                            }
                            product.addVariant(variant);
                        }
                    }
                    productsToSave.add(product);
                }

                hasNextPage = connection.pageInfo() != null && connection.pageInfo().hasNextPage();
                cursor = connection.pageInfo() != null ? connection.pageInfo().endCursor() : null;
            }

            List<Product> existingProducts = productRepository.findAll();
            for (Product existing : existingProducts) {
                if (!incomingProductIds.contains(existing.getId())) {
                    productRepository.delete(existing);
                }
            }

            productRepository.saveAll(productsToSave);
            return productsToSave.size();

        } catch (Exception e) {
            throw new RuntimeException("Sync failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void handleInventoryWebhook(InventoryWebhookPayload payload) {
        if (payload == null || payload.inventoryItemId() == null) {
            return;
        }

        String itemIdStr = extractNumericId(String.valueOf(payload.inventoryItemId()));
        ProductVariant variant = productVariantRepository.findByInventoryItemId(itemIdStr).orElse(null);

        if (variant == null) {
            return;
        }

        String locationIdStr = String.valueOf(payload.locationId());
        int newAvailable = payload.available() != null ? payload.available() : 0;

        boolean levelFound = false;
        for (InventoryLevel level : variant.getInventoryLevels()) {
            if (level.getLocationId().endsWith(locationIdStr)) {
                level.setAvailableQuantity(newAvailable);
                levelFound = true;
                break;
            }
        }

        if (!levelFound) {
            String resolvedLocationName = inventoryLevelRepository.findAll().stream()
                    .filter(il -> il.getLocationId().endsWith(locationIdStr))
                    .map(InventoryLevel::getLocationName)
                    .findFirst()
                    .orElse("Location " + locationIdStr);

            InventoryLevel newLevel = new InventoryLevel(
                    "gid://shopify/Location/" + locationIdStr,
                    resolvedLocationName,
                    newAvailable
            );
            variant.addInventoryLevel(newLevel);
        }

        productVariantRepository.save(variant);

        int totalStock = 0;
        for (InventoryLevel level : variant.getInventoryLevels()) {
            totalStock += level.getAvailableQuantity();
        }

        int threshold = variant.getAlertThreshold() != null
                ? variant.getAlertThreshold()
                : getLowInventoryThreshold();

        boolean isLow = totalStock < threshold;

        StockUpdateEvent event = new StockUpdateEvent(
                variant.getId(),
                variant.getTitle(),
                variant.getProduct() != null ? variant.getProduct().getTitle() : "",
                totalStock,
                isLow
        );

        eventPublisher.publishEvent(event);
    }

    @Transactional(readOnly = true)
    public List<LocationDto> getDistinctLocations() {
        List<LocationProjection> projections = inventoryLevelRepository.findDistinctLocations();
        List<LocationDto> result = new ArrayList<>();
        for (LocationProjection p : projections) {
            result.add(new LocationDto(p.getLocationId(), p.getLocationName()));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public MetricsResponse getInventoryMetrics(String locationId, Integer thresholdParam) {
        int threshold = thresholdParam != null ? thresholdParam : getLowInventoryThreshold();
        boolean isAllLocations = locationId == null || locationId.equalsIgnoreCase("ALL");
        long count = isAllLocations
                ? productRepository.countLowStockProducts(threshold)
                : productRepository.countLowStockProductsByLocation(locationId, threshold);

        return new MetricsResponse(count, threshold);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(int page, int size, String locationId, Integer thresholdParam, boolean lowStockOnly) {
        PageRequest pageRequest = PageRequest.of(page, size);
        int globalThreshold = thresholdParam != null ? thresholdParam : getLowInventoryThreshold();
        boolean isAllLocations = locationId == null || locationId.equalsIgnoreCase("ALL");

        Page<String> pagedIds;
        if (lowStockOnly) {
            pagedIds = isAllLocations
                    ? productRepository.findLowStockProductIds(globalThreshold, pageRequest)
                    : productRepository.findLowStockProductIdsByLocation(locationId, globalThreshold, pageRequest);
        } else {
            pagedIds = isAllLocations
                    ? productRepository.findAllProductIds(pageRequest)
                    : productRepository.findAllProductIdsByLocation(locationId, pageRequest);
        }

        if (pagedIds.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageRequest, 0);
        }

        List<Product> products = productRepository.findProductsWithDetailsByIds(pagedIds.getContent());

        Map<String, Product> productMap = new HashMap<>();
        for (Product product : products) {
            productMap.put(product.getId(), product);
        }

        List<ProductResponse> content = new ArrayList<>();
        for (String id : pagedIds.getContent()) {
            Product product = productMap.get(id);
            if (product != null) {
                content.add(mapToProductResponse(product, locationId, globalThreshold));
            }
        }

        return new PageImpl<>(content, pageRequest, pagedIds.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<CustomThresholdVariantDto> getVariantsWithCustomThreshold() {
        List<ProductVariant> variants = productVariantRepository.findVariantsWithCustomThreshold();
        List<CustomThresholdVariantDto> result = new ArrayList<>();
        for (ProductVariant v : variants) {
            result.add(new CustomThresholdVariantDto(
                    v.getId(),
                    v.getTitle(),
                    v.getProduct() != null ? v.getProduct().getTitle() : "",
                    v.getSku(),
                    v.getPrice(),
                    v.getAlertThreshold()
            ));
        }
        return result;
    }

    @Transactional
    public ProductResponse.VariantResponse updateVariantThreshold(String variantId, Integer threshold, String locationId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found: " + variantId));

        variant.setAlertThreshold(threshold);
        productVariantRepository.save(variant);

        boolean isLocationSpecific = locationId != null && !locationId.equalsIgnoreCase("ALL");
        int scopedStock = 0;
        for (InventoryLevel level : variant.getInventoryLevels()) {
            if (!isLocationSpecific || level.getLocationId().equals(locationId)) {
                scopedStock += level.getAvailableQuantity();
            }
        }

        int effectiveThreshold = threshold != null ? threshold : getLowInventoryThreshold();
        boolean isLow = scopedStock < effectiveThreshold;

        return new ProductResponse.VariantResponse(
                variant.getId(),
                variant.getTitle(),
                variant.getSku(),
                variant.getPrice(),
                scopedStock,
                variant.getAlertThreshold(),
                isLow
        );
    }

    private ProductResponse mapToProductResponse(Product product, String locationId, int globalThreshold) {
        int totalStock = 0;
        boolean hasAnyLowVariant = false;
        boolean isLocationSpecific = locationId != null && !locationId.equalsIgnoreCase("ALL");
        List<ProductResponse.VariantResponse> variantResponses = new ArrayList<>();

        for (ProductVariant variant : product.getVariants()) {
            boolean isTrackedAtLocation = false;
            int variantStock = 0;

            for (InventoryLevel level : variant.getInventoryLevels()) {
                if (!isLocationSpecific) {
                    variantStock += level.getAvailableQuantity();
                    isTrackedAtLocation = true;
                } else if (level.getLocationId().equals(locationId)) {
                    variantStock += level.getAvailableQuantity();
                    isTrackedAtLocation = true;
                }
            }

            if (isLocationSpecific && !isTrackedAtLocation) {
                continue;
            }

            totalStock += variantStock;

            int effectiveVariantThreshold = variant.getAlertThreshold() != null
                    ? variant.getAlertThreshold()
                    : globalThreshold;

            boolean isVariantLow = variantStock < effectiveVariantThreshold;
            if (isVariantLow) {
                hasAnyLowVariant = true;
            }

            variantResponses.add(new ProductResponse.VariantResponse(
                    variant.getId(),
                    variant.getTitle(),
                    variant.getSku(),
                    variant.getPrice(),
                    variantStock,
                    variant.getAlertThreshold(),
                    isVariantLow
            ));
        }

        boolean isOverallLow = !variantResponses.isEmpty() && (totalStock < globalThreshold || hasAnyLowVariant);

        return new ProductResponse(
                product.getId(),
                product.getTitle(),
                product.getVendor(),
                product.getProductType(),
                product.getStatus(),
                product.getImageUrl(),
                totalStock,
                isOverallLow,
                variantResponses
        );
    }
}