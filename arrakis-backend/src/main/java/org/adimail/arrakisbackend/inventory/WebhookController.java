package org.adimail.arrakisbackend.inventory;

import org.adimail.arrakisbackend.inventory.dto.InventoryDtos.InventoryWebhookPayload;
import org.adimail.arrakisbackend.notification.SseNotificationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api")
public class WebhookController {

    private final InventoryService inventoryService;
    private final SseNotificationService sseNotificationService;

    public WebhookController(InventoryService inventoryService, SseNotificationService sseNotificationService) {
        this.inventoryService = inventoryService;
        this.sseNotificationService = sseNotificationService;
    }

    @PostMapping("/webhooks/inventory-level-update")
    public ResponseEntity<Void> handleInventoryLevelWebhook(@RequestBody InventoryWebhookPayload payload) {
        inventoryService.handleInventoryWebhook(payload);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/inventory/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamInventoryUpdates() {
        return sseNotificationService.createEmitter();
    }
}