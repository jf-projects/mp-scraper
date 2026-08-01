export const propertyTools = [
    {
        functionDeclarations: [

            {
                name: "searchHouseAndLot",
                description: "Search House and Lot properties using filters.",
                parametersJsonSchema: {
                    type: "object",
                    properties: {
                        city: { type: "string" },
                        province: { type: "string" },
                        bedrooms: { type: "number" },
                        maxPrice: { type: "number" }
                    }
                }
            },

            {
                name: "searchTownhouses",
                description: "Search Townhouse properties using filters.",
                parametersJsonSchema: {
                    type: "object",
                    properties: {
                        city: { type: "string" },
                        province: { type: "string" },
                        bedrooms: { type: "number" },
                        maxPrice: { type: "number" }
                    }
                }
            },

            {
                name: "searchCondominiums",
                description: "Search Condominium properties using filters.",
                parametersJsonSchema: {
                    type: "object",
                    properties: {
                        city: { type: "string" },
                        province: { type: "string" },
                        bedrooms: { type: "number" },
                        maxPrice: { type: "number" }
                    }
                }
            },

            {
                name: "getProperty",
                description: "Get one property by URL or TITLE.",
                parametersJsonSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string"
                        }
                    },
                    required: ["query"]
                }
            },

            {
                name: "compareProperties",
                description: "Compare multiple properties using URL or TITLE.",
                parametersJsonSchema: {
                    type: "object",
                    properties: {
                        houses: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        }
                    },
                    required: ["houses"]
                }
            }

        ]
    }
];