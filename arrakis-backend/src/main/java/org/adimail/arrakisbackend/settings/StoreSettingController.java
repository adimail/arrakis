package org.adimail.arrakisbackend.settings;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class StoreSettingController {

    private final StoreSettingService service;

    public StoreSettingController(StoreSettingService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Map<String, Integer>> getSettings() {
        int threshold = service.getLowInventoryThreshold();
        return ResponseEntity.ok(Map.of("threshold", threshold));
    }

    @PostMapping
    public ResponseEntity<Map<String, Integer>> updateSettings(@RequestBody Map<String, Integer> request) {
        int threshold = request.getOrDefault("threshold", 10);
        service.setLowInventoryThreshold(threshold);
        return ResponseEntity.ok(Map.of("threshold", threshold));
    }
}