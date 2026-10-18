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
            @RequestParam(defaultValue = "10") int threshold
    ) {
        Page<ProductResponse> products = inventoryService.getProducts(page, size, locationId, threshold);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/locations")
    public ResponseEntity<List<Map<String, String>>> getLocations() {
        return ResponseEntity.ok(inventoryService.getDistinctLocations());
    }
}