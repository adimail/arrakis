package org.adimail.arrakisbackend.inventory.dto;

import java.util.List;

public class ShopifyData {

    public record GraphQLResponse(DataContainer data) {}

    public record DataContainer(ProductConnection products) {}

    public record ProductConnection(List<ProductNode> nodes) {}

    public record ProductNode(
            String id,
            String title,
            String vendor,
            String productType,
            String status,
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

    public record InventoryItemNode(InventoryLevelConnection inventoryLevels) {}

    public record InventoryLevelConnection(List<InventoryLevelNode> nodes) {}

    public record InventoryLevelNode(
            LocationNode location,
            List<QuantityNode> quantities
    ) {}

    public record LocationNode(String id, String name) {}

    public record QuantityNode(String name, int quantity) {}
}