# Envio Generator Customization

File ini menjelaskan cara mengkustomisasi generator Envio agar tidak meng-overwrite konfigurasi tertentu saat update.

## Menghindari Import yang Bermasalah

Jika ada type/import tertentu yang tidak tersedia di generated types atau menyebabkan error, Anda bisa menambahkannya ke daftar exclude di `schemaGenerator.ts`:

```typescript
const EXCLUDED_IMPORTS = [
  'ERC6551AccountProxy', // Not exported from generated types
  // Tambahkan import lain yang perlu di-exclude di sini
];
```

## Mengatasi Konflik Field Name dengan Envio

Envio memiliki field reserved tertentu yang digunakan untuk internal tracking (misalnya `action` untuk entity history). Jika event Anda memiliki field dengan nama yang sama, field tersebut akan otomatis di-rename.

Untuk menambahkan mapping field name baru:

```typescript
const RESERVED_FIELD_NAMES: Record<string, string> = {
  'action': 'gameAction', // Conflicts with Envio's entity history tracking
  // Tambahkan mapping lain jika diperlukan
  // 'conflictingName': 'newName',
};
```

## Cara Kerja

1. **EXCLUDED_IMPORTS**: Saat generate `EventHandlers.ts`, imports dalam list ini akan difilter dan tidak akan ditambahkan ke file.

2. **RESERVED_FIELD_NAMES**: 
   - Saat generate schema GraphQL, field name yang reserved akan otomatis diganti
   - Saat generate event handler, field name yang diganti akan digunakan dalam entity, tapi masih mengambil dari `event.params` dengan nama aslinya

## Update Envio Safely

Setelah konfigurasi di atas, Anda bisa menjalankan:

```bash
# Update sekali
pnpm run update

# Atau watch mode
pnpm run envio:watch
```

Generator akan otomatis:
- ✅ Exclude imports yang tidak diinginkan
- ✅ Rename field names yang konflik
- ✅ Generate code yang valid tanpa error
