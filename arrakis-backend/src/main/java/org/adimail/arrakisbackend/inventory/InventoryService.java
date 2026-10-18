package org.adimail.arrakisbackend.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.adimail.arrakisbackend.config.ShopifyClientConfig;
import org.adimail.arrakisbackend.inventory.dto.ProductResponse;
import org.adimail.arrakisbackend.inventory.dto.ShopifyData;
import org.adimail.arrakisbackend.inventory.model.InventoryLevel;
import org.adimail.arrakisbackend.inventory.model.Product;
import org.adimail.arrakisbackend.inventory.model.ProductVariant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final ShopifyClientConfig shopifyConfig;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public InventoryService(ProductRepository productRepository,
                            ShopifyClientConfig shopifyConfig,
                            HttpClient httpClient,
                            ObjectMapper objectMapper) {
        this.productRepository = productRepository;
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
    public List<java.util.Map<String, String>> getDistinctLocations() {
        List<Product> products = productRepository.findAll();
        java.util.Map<String, String> locationMap = new java.util.HashMap<>();

        for (Product product : products) {
            for (ProductVariant variant : product.getVariants()) {
                for (InventoryLevel level : variant.getInventoryLevels()) {
                    locationMap.putIfAbsent(level.getLocationId(), level.getLocationName());
                }
            }
        }

        List<java.util.Map<String, String>> result = new java.util.ArrayList<>();
        for (java.util.Map.Entry<String, String> entry : locationMap.entrySet()) {
            result.add(java.util.Map.of("id", entry.getKey(), "name", entry.getValue()));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(int page, int size, String locationId, int threshold) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.findAll(pageRequest);

        List<ProductResponse> responseList = productPage.getContent().stream()
                .map(product -> mapToProductResponse(product, locationId, threshold))
                .toList();

        return new PageImpl<>(responseList, pageRequest, productPage.getTotalElements());
    }

    private ProductResponse mapToProductResponse(Product product, String locationId, int threshold) {
        int totalStock = 0;
        List<ProductResponse.VariantResponse> variantResponses = new ArrayList<>();

        for (ProductVariant variant : product.getVariants()) {
            int variantStock = 0;
            for (InventoryLevel level : variant.getInventoryLevels()) {
                if (locationId == null || locationId.equalsIgnoreCase("ALL") || level.getLocationId().equals(locationId)) {
                    variantStock += level.getAvailableQuantity();
                }
            }
            totalStock += variantStock;
            variantResponses.add(new ProductResponse.VariantResponse(
                    variant.getId(),
                    variant.getTitle(),
                    variant.getSku(),
                    variant.getPrice(),
                    variantStock
            ));
        }

        boolean isLow = totalStock < threshold;

        return new ProductResponse(
                product.getId(),
                product.getTitle(),
                product.getVendor(),
                product.getProductType(),
                product.getStatus(),
                product.getImageUrl(),
                totalStock,
                isLow,
                variantResponses
        );
    }
}