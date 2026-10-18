package org.adimail.arrakisbackend.inventory;

import org.adimail.arrakisbackend.inventory.dto.InventoryDtos.LocationProjection;
import org.adimail.arrakisbackend.inventory.model.InventoryLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryLevelRepository extends JpaRepository<InventoryLevel, Long> {

    @Query("SELECT DISTINCT il.locationId AS locationId, il.locationName AS locationName FROM InventoryLevel il")
    List<LocationProjection> findDistinctLocations();
}