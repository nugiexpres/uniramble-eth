# 📚 Envio Indexer Update Guide

## 🔄 Kapan Perlu Update Envio?

Envio indexer **HARUS** di-update ketika:

1. ✅ **Deploy contract baru** - Contract baru ditambahkan ke sistem
2. ✅ **Re-deploy contract** - Contract di-deploy ulang dengan address baru
3. ✅ **Update contract events** - Event baru ditambahkan atau diubah di contract
4. ✅ **Perubahan ABI** - Interface contract berubah
5. ✅ **Ganti network/chain** - Deploy ke network baru atau ganti RPC

## 🎯 Cara Update Envio Indexer

### Method 1: Auto-Update (Recommended) ⚡

Script ini akan otomatis membaca dari `packages/nextjs/contracts/deployedContracts.ts` dan update config Envio.

```bash
cd packages/envio

# Update sekali
pnpm envio:update
# atau
pnpm update

# Watch mode (auto-update saat ada perubahan)
pnpm envio:watch
```

**Proses yang terjadi:**
1. ✅ Membaca `deployedContracts.ts` dari Scaffold-ETH
2. ✅ Parse semua contract addresses dan ABIs
3. ✅ Update `config.yaml` dengan addresses terbaru
4. ✅ Generate schema GraphQL otomatis
5. ✅ Run `envio codegen` untuk generate TypeScript types

### Method 2: Manual Update 📝

Jika auto-update gagal atau perlu custom configuration:

#### Step 1: Update Contract Addresses di `config.yaml`

```yaml
networks:
  - id: 10143  # Monad Testnet
    start_block: 43381427  # Block number saat deploy pertama
    contracts:
      - name: PaymentGateway
        address:
          - "0xNEW_ADDRESS_HERE"  # Update dengan address baru
      - name: FoodNFT
        address:
          - "0xNEW_ADDRESS_HERE"
      # ... contract lainnya
```

#### Step 2: Update Start Block (Opsional)

Jika deploy ulang semua contract, update `start_block` ke block number terbaru:

```yaml
networks:
  - id: 10143
    start_block: 43500000  # Block number deploy terbaru
```

#### Step 3: Generate Code

```bash
pnpm codegen
# atau
pnpm envio:generate
```

## 🔧 Workflow Lengkap Setelah Deploy/Re-deploy

### Scenario 1: Deploy Contract Baru

```bash
# 1. Deploy contract di hardhat
cd packages/hardhat
pnpm deploy --network monadTestnet

# 2. Generate deployedContracts.ts (otomatis oleh Scaffold-ETH)
# File packages/nextjs/contracts/deployedContracts.ts akan ter-update

# 3. Update Envio config
cd ../envio
pnpm envio:update

# 4. Restart indexer
pnpm dev
```

### Scenario 2: Re-deploy Semua Contract

```bash
# 1. Hapus deployment artifacts lama (jika perlu clean deploy)
cd packages/hardhat
rm -rf deployments/monadTestnet

# 2. Deploy ulang
pnpm deploy --network monadTestnet

# 3. Update Envio
cd ../envio
pnpm envio:update

# 4. Reset database dan restart (jika perlu index dari awal)
# Stop indexer dulu (Ctrl+C)
# Hapus data lama di Docker volume jika perlu
pnpm dev
```

### Scenario 3: Update Event/ABI Saja (Tanpa Deploy Ulang)

```bash
# 1. Update contract source code
# Edit contracts di packages/hardhat/contracts/

# 2. Compile
cd packages/hardhat
pnpm compile

# 3. Update ABI di deployedContracts.ts (manual atau re-deploy)

# 4. Update Envio
cd ../envio
pnpm envio:update

# 5. Restart indexer
pnpm dev
```

## 📋 Checklist Update Envio

- [ ] Contract addresses sudah benar di `config.yaml`
- [ ] Start block sudah sesuai dengan block deploy
- [ ] Semua contract events sudah terdaftar
- [ ] Run `pnpm codegen` berhasil tanpa error
- [ ] File `generated/` ter-update dengan types baru
- [ ] Test indexer dengan `pnpm dev`
- [ ] Cek GraphQL playground di http://localhost:8080
- [ ] Verify data ter-index dengan benar

## 🐛 Troubleshooting

### Error: "Contract not found"
```bash
# Pastikan address benar di config.yaml
# Cek deployment artifacts
cat ../hardhat/deployments/monadTestnet/PaymentGateway.json | grep address
```

### Error: "Start block too old"
```bash
# Update start_block ke block number yang lebih baru
# Atau gunakan block number saat contract di-deploy
```

### Error: "Event not found in ABI"
```bash
# Update ABI di config.yaml atau re-run codegen
pnpm codegen
```

### Indexer tidak index data
```bash
# 1. Cek start_block sudah benar
# 2. Cek contract address sudah benar
# 3. Cek network RPC berfungsi
# 4. Restart indexer
pnpm dev
```

## 📚 File Penting

- `config.yaml` - Konfigurasi utama (addresses, events, networks)
- `schema.graphql` - GraphQL schema untuk query data
- `src/EventHandlers.ts` - Handler untuk process events
- `packages/nextjs/contracts/deployedContracts.ts` - Source of truth untuk addresses
- `scripts/auto-update.ts` - Script auto-update
- `se-integration/` - Integration dengan Scaffold-ETH

## 🚀 Commands Cheat Sheet

```bash
# Development
pnpm dev                 # Start indexer dengan hot-reload
pnpm start              # Start production indexer

# Update & Generate
pnpm update             # Update config dari deployedContracts.ts
pnpm envio:update       # Same as above
pnpm envio:watch        # Watch mode untuk auto-update
pnpm codegen            # Generate types dari config.yaml
pnpm envio:generate     # Same as above

# Build & Test
pnpm build              # Build TypeScript
pnpm test               # Run tests
pnpm clean              # Clean build artifacts

# Deployment
pnpm envio:deploy       # Deploy indexer ke Envio cloud
pnpm envio:start        # Start deployed indexer
```

## 💡 Best Practices

1. **Selalu update Envio setelah deploy contract** - Jangan lupa!
2. **Gunakan auto-update** - Lebih cepat dan akurat
3. **Backup config.yaml** - Sebelum perubahan besar
4. **Test di local dulu** - Sebelum deploy ke production
5. **Monitor indexer logs** - Untuk detect error early
6. **Keep start_block accurate** - Untuk performance optimal
7. **Document custom changes** - Jika ada modifikasi manual

## 🔗 Resources

- [Envio Documentation](https://docs.envio.dev)
- [GraphQL Playground](http://localhost:8080) (password: `testing`)
- Scaffold-ETH deployedContracts: `packages/nextjs/contracts/deployedContracts.ts`
- Hardhat deployments: `packages/hardhat/deployments/`
