package org.adimail.arrakisbackend.inventory;

import org.adimail.arrakisbackend.inventory.model.StoreSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreSettingRepository extends JpaRepository<StoreSetting, String> {
}