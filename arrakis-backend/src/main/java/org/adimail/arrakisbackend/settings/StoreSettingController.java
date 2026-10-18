package org.adimail.arrakisbackend.settings;

import org.adimail.arrakisbackend.settings.dto.SettingDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class StoreSettingController {

    private final StoreSettingService service;

    public StoreSettingController(StoreSettingService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<SettingDto> getSettings() {
        int threshold = service.getLowInventoryThreshold();
        return ResponseEntity.ok(new SettingDto(threshold));
    }

    @PostMapping
    public ResponseEntity<SettingDto> updateSettings(@RequestBody SettingDto request) {
        service.setLowInventoryThreshold(request.threshold());
        return ResponseEntity.ok(new SettingDto(request.threshold()));
    }
}