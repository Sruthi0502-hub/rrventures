import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private confingService: ConfigService) {
        super({
            // ✅ Yahan dhyan dena: 'fromAuthHeaderAsBearerToken' (small f)
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: confingService.get<string>('SECRET_KEY'), // Aapka secret key
        });
    }

    async validate(payload: any) {
        //console.log('Jwt payload', payload)
        // Jo data token ke andar hoga (jaise id, email, role) wo yahan milega
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}