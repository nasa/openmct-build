import { compileFromFile } from 'json-schema-to-typescript';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function generateTypes() {
  const schemaPath = join(__dirname, '../src/yaml/openmct-configuration-schema.json');
  const outputPath = join(__dirname, '../src/openmct/OpenMctConfigurationDocument.ts');
  
  try {
    const ts = await compileFromFile(schemaPath, {
      style: {
        singleQuote: true,
        printWidth: 120,
        bracketSpacing: true,
        tabWidth: 2,
        useTabs: false,
        semi: true,
      },
      declareExternallyReferenced: true,
      strictIndexSignatures: true,
      additionalProperties: false
    });

    writeFileSync(outputPath, ts);
    console.log(`✅ Types generated successfully at ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating types:', error);
    process.exit(1);
  }
}

generateTypes();
