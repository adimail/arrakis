package org.adimail.arrakisbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.http.HttpClient;

@Configuration
public class ShopifyClientConfig {

    @Value("${shopify.store-domain}")
    private String storeDomain;

    @Value("${shopify.access-token}")
    private String accessToken;

    @Value("${shopify.api-version:2025-01}")
    private String apiVersion;

    @Bean
    public HttpClient httpClient() {
        return HttpClient.newHttpClient();
    }

    public String getGraphQLEndpoint() {
        return "https://" + storeDomain + "/admin/api/" + apiVersion + "/graphql.json";
    }

    public String getAccessToken() {
        return accessToken;
    }
}