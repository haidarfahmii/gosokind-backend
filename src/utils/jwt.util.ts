import jwt, { SignOptions } from "jsonwebtoken";
import { JWTPayload } from "../@types";

export async function createToken(
    payload: JWTPayload,
    secretKey: string,
    options?: SignOptions
): Promise<string> {
    // untuk memastikan secretKey ada sebelum di proses
    if (!secretKey) {
        throw new Error("Secret key is required");
    }

    return await jwt.sign(payload, secretKey, options);
}

export async function verifyToken(
    token: string,
    secretKey: string
): Promise<JWTPayload> {
    // verify terlebih dahulu
    const decode = jwt.verify(token, secretKey);

    // validasi: pastikan hasil decode adalah Object bukan string
    if (typeof decode === "string") {
        throw new Error("Invalid token structure");
    }

    return (await decode) as JWTPayload;
}
