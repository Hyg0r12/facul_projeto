package br.com.projetox.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/Dashboard/**")
                .addResourceLocations("file:Dashboard/");
        registry.addResourceHandler("/Login/**")
                .addResourceLocations("file:Login/");
        registry.addResourceHandler("/Wesley/**")
                .addResourceLocations("file:Wesley/");
        registry.addResourceHandler("/map/**")
                .addResourceLocations("file:map/");
        registry.addResourceHandler("/redefinir_senha/**")
                .addResourceLocations("file:redefinir_senha/");
    }
}
