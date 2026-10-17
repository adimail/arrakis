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

    @Bean
    public HttpClient httpClient() {
        return HttpClient.newHttpClient();
    }

    public String getGraphQLEndpoint() {
        return "https://" + storeDomain + "/admin/api/2024-01/graphql.json";
    }

    public String getAccessToken() {
        return accessToken;
    }
}