export const amountSchema = { bignumber: { minimum: 0, maximum: 0 } };

export const vendorFieldSchema = { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] };

export const notarizationSchema = {
    type: "object",
    required: ["hash"],
    properties: {
        hash: { type: "string", minLength: 1 },
    },
};
