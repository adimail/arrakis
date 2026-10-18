package org.adimail.arrakisbackend.inventory.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

public class ShopifyData {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GraphQLResponse(DataContainer data, List<Map<String, Object>> errors) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DataContainer(ProductConnection products) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PageInfo(boolean hasNextPage, String endCursor) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProductConnection(PageInfo pageInfo, List<ProductNode> nodes) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImageNode(String url) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProductNode(
            String id,
            String title,
            String vendor,
            String productType,
            String status,
            ImageNode featuredImage,
            VariantConnection variants
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record VariantConnection(List<VariantNode> nodes) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record VariantNode(
            String id,
            String title,
            String sku,
            String price,
            InventoryItemNode inventoryItem
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InventoryItemNode(
            String id,
            InventoryLevelConnection inventoryLevels
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InventoryLevelConnection(List<InventoryLevelNode> nodes) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InventoryLevelNode(
            LocationNode location,
            List<QuantityNode> quantities
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LocationNode(String id, String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuantityNode(String name, int quantity) {}
}