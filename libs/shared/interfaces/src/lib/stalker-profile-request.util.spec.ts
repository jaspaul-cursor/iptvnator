import {
    buildStalkerHwVersion2,
    buildStalkerMacSha1Hex,
    buildStalkerProfileMetrics,
} from './stalker-profile-request.util';

describe('stalker profile request helpers', () => {
    beforeEach(() => {
        Object.defineProperty(globalThis, 'crypto', {
            configurable: true,
            value: {
                subtle: {
                    digest: jest.fn(
                        async () => new Uint8Array(20).fill(1).buffer
                    ),
                },
            },
        });
    });

    it('builds metrics with model, uid and random', () => {
        expect(
            buildStalkerProfileMetrics({
                macAddress: '00:1A:79:29:07:4E',
                handshakeRandom: 'af30f90d4ef5b4a723836715575e55ad0aeea3f9',
                serialNumber: '062014N083635',
            })
        ).toEqual({
            mac: '00:1A:79:29:07:4E',
            sn: '062014N083635',
            model: 'MAG254',
            type: 'STB',
            uid: '',
            random: 'af30f90d4ef5b4a723836715575e55ad0aeea3f9',
        });
    });

    it('derives lowercase SHA-1 hex from the canonical MAC', async () => {
        await expect(
            buildStalkerMacSha1Hex('00-1a-79-29-07-4e')
        ).resolves.toBe('0101010101010101010101010101010101010101');
        await expect(buildStalkerHwVersion2('00:1A:79:29:07:4E')).resolves.toBe(
            '0101010101010101010101010101010101010101'
        );
    });
});
