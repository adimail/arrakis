package org.adimail.arrakisbackend.inventory.dto;

import java.util.List;

public class ShopifyData {

    public record GraphQLResponse(DataContainer data) {}

    public record DataContainer(ProductConnection products) {}

    public record PageInfo(boolean hasNextPage, String endCursor) {}

    public record ProductConnection(PageInfo pageInfo, List<ProductNode> nodes) {}

    public record ImageNode(String url) {}

    public record ProductNode(
            String id,
            String title,
            String vendor,
            String productType,
            String status,
            ImageNode featuredImage,
            VariantConnection variants
    ) {}

    public record VariantConnection(List<VariantNode> nodes) {}

    public record VariantNode(
            String id,
            String title,
            String sku,
            String price,
            InventoryItemNode inventoryItem
    ) {}

    public record InventoryItemNode(
            String id,
            InventoryLevelConnection inventoryLevels
    ) {}

    public record InventoryLevelConnection(List<InventoryLevelNode> nodes) {}

    public record InventoryLevelNode(
            LocationNode location,
            List<QuantityNode> quantities
    ) {}

    public record LocationNode(String id, String name) {}

    public record QuantityNode(String name, int quantity) {}
}