package org.adimail.arrakisbackend.settings.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "settings")
public class StoreSetting {

    @Id
    @Column(name = "setting_key", nullable = false, unique = true)
    private String key;

    @Column(name = "setting_value", nullable = false)
    private String value;

    public StoreSetting() {}

    public StoreSetting(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}