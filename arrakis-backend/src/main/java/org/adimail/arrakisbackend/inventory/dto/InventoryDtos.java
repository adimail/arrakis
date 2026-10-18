package org.adimail.arrakisbackend.inventory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

public final class InventoryDtos {

    private InventoryDtos() {}

    @Schema(name = "SettingDto")
    public record SettingDto(int threshold) {}

    @Schema(name = "MetricsResponse")
    public record MetricsResponse(long lowStockCount, int threshold) {}

    @Schema(name = "UpdateThresholdRequest")
    public record UpdateThresholdRequest(String variantId, Integer threshold) {}

    @Schema(name = "LocationDto")
    public record LocationDto(String id, String name) {}

    @Schema(name = "SyncResponse")
    public record SyncResponse(String message, int syncedProductsCount, String syncedAt) {}

    @Schema(name = "CustomThresholdVariantDto")
    public record CustomThresholdVariantDto(
            String variantId,
            String variantTitle,
            String productTitle,
            String sku,
            String price,
            int alertThreshold
    ) {}

    @Schema(name = "InventoryWebhookPayload")
    public record InventoryWebhookPayload(
            @JsonProperty("inventory_item_id") Long inventoryItemId,
            @JsonProperty("location_id") Long locationId,
            @JsonProperty("available") Integer available,
            @JsonProperty("updated_at") String updatedAt
    ) {}

    public interface LocationProjection {
        String getLocationId();
        String getLocationName();
    }
}