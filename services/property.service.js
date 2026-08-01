import fs from "fs";

const houses = removeDuplicateTitles(JSON.parse(
    fs.readFileSync("housing.json", "utf8")
));

const townhouses = removeDuplicateTitles(
    JSON.parse(
        fs.readFileSync("townhouse.json", "utf8")
    )
);

const condominiums = removeDuplicateTitles(
    JSON.parse(
        fs.readFileSync("condominium.json", "utf8")
    )
).map(property => ({
    ...property,
    type: "condominium"
}));

function getPrice(property) {
    return Number(String(property.selling_price || property.price || 0).replace(/[^\d]/g, ""));
}


function search(list, filters = {}) {

    return list.filter(property => {

        if (
            filters.city &&
            !property.city_town?.toLowerCase().includes(filters.city.toLowerCase())
        ) {
            return false;
        }

        if (
            filters.province &&
            !property.province?.toLowerCase().includes(filters.province.toLowerCase())
        ) {
            return false;
        }

        if (
            filters.bedrooms &&
            Number(property.bedrooms || 0) < filters.bedrooms
        ) {
            return false;
        }

        if (
            filters.bathrooms &&
            Number(property.bathrooms || 0) < filters.bathrooms
        ) {
            return false;
        }

        if (
            filters.parking &&
            Number(property.carport || 0) < filters.parking
        ) {
            return false;
        }

        if (
            filters.minLotArea &&
            Number(property.lot_area || 0) < filters.minLotArea
        ) {
            return false;
        }

        if (
            filters.minFloorArea &&
            Number(property.floor_area || 0) < filters.minFloorArea
        ) {
            return false;
        }

        if (
            filters.pool &&
            !property.additional_features?.some(feature =>
                feature.toLowerCase().includes("pool")
            )
        ) {
            return false;
        }

        if (
            filters.maxPrice &&
            getPrice(property) > filters.maxPrice
        ) {
            return false;
        }

        return true;
    });

}


export function getProperty({ query }) {

    const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    const allProperties = [
        ...houses,
        ...townhouses,
        ...condominiums
    ];

    const property = allProperties.find(property => {

        const text = `${property.title} ${property.url}`.toLowerCase();

        return keywords.every(keyword => text.includes(keyword));
    });

    if (!property) {
        return {
            success: false,
            message: `No property found matching "${query}".`
        };
    }

    return {
        success: true,
        property
    };
}

export function compareProperties({ houses_arr }) {

    const allProperties = [
        ...houses,
        ...townhouses,
        ...condominiums
    ];

    return allProperties.filter(property =>
        houses_arr.some(search =>
            property.title.toLowerCase().includes(search.toLowerCase()) ||
            property.url.toLowerCase().includes(search.toLowerCase())
        )
    );
}


export function searchHouseAndLot(filters) {
    const properties = search(houses, filters);
    return properties.map(property => ({
        id: property.id,
        title: property.title,
        propertyType: property.property_type,
        location: property.location,
        city: property.city,
        province: property.province,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking: property.carport,
        lotArea: property.lot_area,
        floorArea: property.floor_area,
        features: property.additional_features
    }));
}

export function searchTownhouses(filters) {
    const properties = search(townhouses, filters);
    return properties.map(property => ({
        id: property.id,
        title: property.title,
        propertyType: property.property_type,
        location: property.location,
        city: property.city,
        province: property.province,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking: property.carport,
        lotArea: property.lot_area,
        floorArea: property.floor_area,
        features: property.additional_features
    }));
}

export function searchCondominiums(filters) {
    const properties = search(condominiums, filters);
    return properties.map(property => ({
        id: property.id,
        title: property.title,
        propertyType: property.property_type,
        location: property.location,
        city: property.city,
        province: property.province,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking: property.carport,
        lotArea: property.lot_area,
        floorArea: property.floor_area,
        features: property.additional_features
    }));
}

export function getAllProperties() {
    return [
        ...houses,
        ...townhouses,
        ...condominiums
    ];
}

function removeDuplicateTitles(properties) {
    const seen = new Set();

    return properties.filter(property => {
        const title = property.title.toLowerCase().trim();

        if (seen.has(title)) {
            return false;
        }

        seen.add(title);

        return true;
    });
}
