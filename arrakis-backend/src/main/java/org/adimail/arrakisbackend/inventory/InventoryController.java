package org.adimail.arrakisbackend.inventory;

import org.adimail.arrakisbackend.inventory.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/sync")
    public ResponseEntity<SyncResponse> syncInventory() {
        int count = inventoryService.syncFromShopify();
        return ResponseEntity.ok(new SyncResponse(
                "Inventory sync completed",
                count,
                Instant.now().toString()
        ));
    }

    @GetMapping("/products")
    public ResponseEntity<Page<ProductResponse>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ALL") String locationId,
            @RequestParam(required = false) Integer threshold,
            @RequestParam(defaultValue = "false") boolean lowStockOnly
    ) {
        Page<ProductResponse> products = inventoryService.getProducts(page, size, locationId, threshold, lowStockOnly);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/metrics")
    public ResponseEntity<MetricsResponse> getMetrics(
            @RequestParam(defaultValue = "ALL") String locationId,
            @RequestParam(required = false) Integer threshold
    ) {
        return ResponseEntity.ok(inventoryService.getInventoryMetrics(locationId, threshold));
    }

    @GetMapping("/variants/custom-thresholds")
    public ResponseEntity<List<CustomThresholdVariantDto>> getCustomThresholdVariants() {
        return ResponseEntity.ok(inventoryService.getVariantsWithCustomThreshold());
    }

    @PutMapping("/variants/{variantId}/threshold")
    public ResponseEntity<ProductResponse.VariantResponse> updateVariantThreshold(
            @PathVariable String variantId,
            @RequestBody UpdateThresholdRequest request
    ) {
        ProductResponse.VariantResponse response = inventoryService.updateVariantThreshold(variantId, request.threshold());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/locations")
    public ResponseEntity<List<LocationDto>> getLocations() {
        return ResponseEntity.ok(inventoryService.getDistinctLocations());
    }
}