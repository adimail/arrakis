package org.adimail.arrakisbackend.inventory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record InventoryWebhookPayload(
        @JsonProperty("inventory_item_id") Long inventoryItemId,
        @JsonProperty("location_id") Long locationId,
        @JsonProperty("available") Integer available,
        @JsonProperty("updated_at") String updatedAt
) {}