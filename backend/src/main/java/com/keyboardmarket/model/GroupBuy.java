package com.keyboardmarket.model;

import java.time.Instant;
import java.util.List;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "group-buys")
@Data
public class GroupBuy {

    @Id
    private String id;

    @Field("topic_id")
    private String topicId;

    private String name;
    private String type;
    private String status;
    private String designer;
    private String overview;
    private String poster;

    @Field("gb_start")
    private String gbStart;

    @Field("gb_end")
    private String gbEnd;

    @Field("estimated_fulfillment")
    private String estimatedFulfillment;

    @Field("base_price")
    private BasePrice basePrice;

    private List<Item> items;
    private List<Vendor> vendors;

    @Field("discord_url")
    private String discordUrl;

    @Field("source_url")
    private String sourceUrl;

    private List<String> images;

    @Field("scraped_at")
    private Instant scrapedAt;

    @Data
    public static class BasePrice {
        private Double amount;
        private String currency;
    }

    @Data
    public static class Item {
        private String name;
        private Double price;
        private String currency;
    }

    @Data
    public static class Vendor {
        private String region;
        private String name;
        private String url;
    }
}
