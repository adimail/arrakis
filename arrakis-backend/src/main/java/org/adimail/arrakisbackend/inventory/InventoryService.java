package org.adimail.arrakisbackend.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.adimail.arrakisbackend.config.ShopifyClientConfig;
import org.adimail.arrakisbackend.inventory.dto.CustomThresholdVariantDto;
import org.adimail.arrakisbackend.inventory.dto.LocationDto;
import org.adimail.arrakisbackend.inventory.dto.LocationProjection;
import org.adimail.arrakisbackend.inventory.dto.MetricsResponse;
import org.adimail.arrakisbackend.inventory.dto.ProductResponse;
import org.adimail.arrakisbackend.inventory.dto.ShopifyData;
import org.adimail.arrakisbackend.inventory.model.InventoryLevel;
import org.adimail.arrakisbackend.inventory.model.Product;
import org.adimail.arrakisbackend.inventory.model.ProductVariant;
import org.adimail.arrakisbackend.settings.StoreSettingService;
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

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryLevelRepository inventoryLevelRepository;
    private final StoreSettingService storeSettingService;
    private final ShopifyClientConfig shopifyConfig;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public InventoryService(ProductRepository productRepository,
                            ProductVariantRepository productVariantRepository,
                            InventoryLevelRepository inventoryLevelRepository,
                            StoreSettingService storeSettingService,
                            ShopifyClientConfig shopifyConfig,
                            HttpClient httpClient,
                            ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.inventoryLevelRepository = inventoryLevelRepository;
        this.storeSettingService = storeSettingService;
        this.shopifyConfig = shopifyConfig;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    private static final String GRAPHQL_QUERY = """
        {
          "query": "query { products(first: 50) { nodes { id title vendor productType status featuredImage { url } variants(first: 50) { nodes { id title sku price inventoryItem { inventoryLevels(first: 10) { nodes { location { id name } quantities(names: [\\"available\\"]) { name quantity } } } } } } } } }"
        }
        """;

    @Transactional
    public int syncFromShopify() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(shopifyConfig.getGraphQLEndpoint()))
                    .header("Content-Type", "application/json")
                    .header("X-Shopify-Access-Token", shopifyConfig.getAccessToken())
                    .POST(HttpRequest.BodyPublishers.ofString(GRAPHQL_QUERY))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Shopify API error: " + response.statusCode() + " - " + response.body());
            }

            ShopifyData.GraphQLResponse graphQLResponse = objectMapper.readValue(
                    response.body(),
                    ShopifyData.GraphQLResponse.class
            );

            Map<String, Integer> existingThresholds = new HashMap<>();
            List<ProductVariant> allExistingVariants = productVariantRepository.findAll();
            for (ProductVariant v : allExistingVariants) {
                if (v.getAlertThreshold() != null) {
                    existingThresholds.put(v.getId(), v.getAlertThreshold());
                }
            }

            List<Product> productsToSave = new ArrayList<>();

            for (ShopifyData.ProductNode pNode : graphQLResponse.data().products().nodes()) {
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

                        if (existingThresholds.containsKey(vNode.id())) {
                            variant.setAlertThreshold(existingThresholds.get(vNode.id()));
                        }

                        if (vNode.inventoryItem() != null && vNode.inventoryItem().inventoryLevels() != null) {
                            for (ShopifyData.InventoryLevelNode lNode : vNode.inventoryItem().inventoryLevels().nodes()) {
                                int available = 0;
                                if (lNode.quantities() != null && !lNode.quantities().isEmpty()) {
                                    available = lNode.quantities().get(0).quantity();
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

            productRepository.saveAll(productsToSave);
            return productsToSave.size();

        } catch (Exception e) {
            throw new RuntimeException("Sync failed: " + e.getMessage(), e);
        }
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
        int threshold = thresholdParam != null ? thresholdParam : storeSettingService.getLowInventoryThreshold();
        boolean isAllLocations = locationId == null || locationId.equalsIgnoreCase("ALL");
        long count = isAllLocations
                ? productRepository.countLowStockProducts(threshold)
                : productRepository.countLowStockProductsByLocation(locationId, threshold);

        return new MetricsResponse(count, threshold);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(int page, int size, String locationId, Integer thresholdParam, boolean lowStockOnly) {
        PageRequest pageRequest = PageRequest.of(page, size);
        int globalThreshold = thresholdParam != null ? thresholdParam : storeSettingService.getLowInventoryThreshold();
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
    public ProductResponse.VariantResponse updateVariantThreshold(String variantId, Integer threshold) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found: " + variantId));

        variant.setAlertThreshold(threshold);
        productVariantRepository.save(variant);

        int totalStock = 0;
        for (InventoryLevel level : variant.getInventoryLevels()) {
            totalStock += level.getAvailableQuantity();
        }

        int effectiveThreshold = threshold != null ? threshold : storeSettingService.getLowInventoryThreshold();
        boolean isLow = totalStock < effectiveThreshold;

        return new ProductResponse.VariantResponse(
                variant.getId(),
                variant.getTitle(),
                variant.getSku(),
                variant.getPrice(),
                totalStock,
                variant.getAlertThreshold(),
                isLow
        );
    }

    private ProductResponse mapToProductResponse(Product product, String locationId, int globalThreshold) {
        int totalStock = 0;
        boolean hasAnyLowVariant = false;
        List<ProductResponse.VariantResponse> variantResponses = new ArrayList<>();

        for (ProductVariant variant : product.getVariants()) {
            int variantStock = 0;
            for (InventoryLevel level : variant.getInventoryLevels()) {
                if (locationId == null || locationId.equalsIgnoreCase("ALL") || level.getLocationId().equals(locationId)) {
                    variantStock += level.getAvailableQuantity();
                }
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

        boolean isOverallLow = totalStock < globalThreshold || hasAnyLowVariant;

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