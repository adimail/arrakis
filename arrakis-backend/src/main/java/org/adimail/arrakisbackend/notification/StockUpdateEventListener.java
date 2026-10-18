package org.adimail.arrakisbackend.notification;

import org.adimail.arrakisbackend.inventory.dto.StockUpdateEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class StockUpdateEventListener {

    private final SseNotificationService sseNotificationService;

    public StockUpdateEventListener(SseNotificationService sseNotificationService) {
        this.sseNotificationService = sseNotificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStockUpdate(StockUpdateEvent event) {
        sseNotificationService.broadcast(event);
    }
}