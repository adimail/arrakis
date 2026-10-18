package org.adimail.arrakisbackend.settings;

import org.adimail.arrakisbackend.settings.model.StoreSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreSettingRepository extends JpaRepository<StoreSetting, String> {
}