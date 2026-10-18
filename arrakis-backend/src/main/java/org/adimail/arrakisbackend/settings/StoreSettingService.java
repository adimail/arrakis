package org.adimail.arrakisbackend.settings;

import org.adimail.arrakisbackend.settings.model.StoreSetting;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StoreSettingService {

    private static final String DEFAULT_THRESHOLD_KEY = "low_inventory_threshold";
    private static final String DEFAULT_THRESHOLD_VALUE = "10";

    private final StoreSettingRepository repository;

    public StoreSettingService(StoreSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public int getLowInventoryThreshold() {
        return repository.findById(DEFAULT_THRESHOLD_KEY)
                .map(setting -> Integer.parseInt(setting.getValue()))
                .orElse(Integer.parseInt(DEFAULT_THRESHOLD_VALUE));
    }

    @Transactional
    public void setLowInventoryThreshold(int threshold) {
        StoreSetting setting = new StoreSetting(DEFAULT_THRESHOLD_KEY, String.valueOf(threshold));
        repository.save(setting);
    }
}