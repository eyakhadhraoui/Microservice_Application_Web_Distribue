package org.example.infectionetvaccination.Config;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.Response;
import feign.codec.Decoder;
import feign.codec.Encoder;
import feign.jackson.JacksonEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;

@Configuration
public class FeignJacksonConfig {

    private final ObjectMapper objectMapper;

    public FeignJacksonConfig(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Bean
    public Encoder feignEncoder() {
        return new JacksonEncoder(objectMapper);
    }


    @Bean
    public Decoder feignDecoder() {
        return new Decoder() {
            @Override
            public Object decode(Response response, Type type) throws IOException {

                if (response.body() == null) {
                    return null;
                }

                InputStream inputStream = response.body().asInputStream();

                JavaType javaType =
                        objectMapper.getTypeFactory().constructType(type);

                return objectMapper.readValue(inputStream, javaType);
            }
        };
    }
}