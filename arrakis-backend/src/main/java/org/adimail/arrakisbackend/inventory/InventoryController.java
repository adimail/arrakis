package org.adimail.arrakisbackend.inventory;

import org.adimail.arrakisbackend.inventory.dto.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncInventory() {
        int count = inventoryService.syncFromShopify();
        return ResponseEntity.ok(Map.of(
                "message", "Inventory sync completed",
                "syncedProductsCount", count,
                "syncedAt", Instant.now().toString()
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
    public ResponseEntity<Map<String, Object>> getMetrics(
            @RequestParam(defaultValue = "ALL") String locationId,
            @RequestParam(required = false) Integer threshold
    ) {
        return ResponseEntity.ok(inventoryService.getInventoryMetrics(locationId, threshold));
    }

    @PutMapping("/variants/threshold")
    public ResponseEntity<ProductResponse.VariantResponse> updateVariantThreshold(
            @RequestParam String variantId,
            @RequestBody Map<String, Integer> request
    ) {
        Integer threshold = request.get("threshold");
        ProductResponse.VariantResponse response = inventoryService.updateVariantThreshold(variantId, threshold);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/locations")
    public ResponseEntity<List<Map<String, String>>> getLocations() {
        return ResponseEntity.ok(inventoryService.getDistinctLocations());
    }
}