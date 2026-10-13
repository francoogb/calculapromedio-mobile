import { CampoNumero, Segmentado } from '@/components/calculadora/campos';
import { Columna, FilaCampos } from '@/components/calculadora/pantalla';
import { leerNumero } from '@/lib/matematica';
import type { Sexo } from '@/lib/salud';

export type DatosCorporales = { sexo: Sexo; edad: string; peso: string; altura: string };

export const DATOS_VACIOS: DatosCorporales = { sexo: 'hombre', edad: '', peso: '', altura: '' };
export const DATOS_EJEMPLO: DatosCorporales = { sexo: 'mujer', edad: '17', peso: '58', altura: '163' };

/** Valida y convierte; null si falta algo o está fuera de rango. */
export function leerDatos(d: DatosCorporales, pedirEdad = true) {
  const edad = leerNumero(d.edad);
  const peso = leerNumero(d.peso);
  const altura = leerNumero(d.altura);
  const errores = {
    edad: d.edad.trim() !== '' && !(edad >= 10 && edad <= 100) ? 'Entre 10 y 100' : null,
    peso: d.peso.trim() !== '' && !(peso >= 20 && peso <= 300) ? 'Entre 20 y 300 kg' : null,
    altura: d.altura.trim() !== '' && !(altura >= 100 && altura <= 250) ? 'Entre 100 y 250 cm' : null,
  };
  const ok = peso > 0 && altura > 0 && (!pedirEdad || edad > 0) && !Object.values(errores).some(Boolean);
  return { ok, errores, edad, peso, altura, sexo: d.sexo };
}

/** Sexo, edad, peso y estatura: los datos que piden las calculadoras de salud. */
export function CamposCorporales({
  datos,
  onCambiar,
  pedirSexo = true,
  pedirEdad = true,
}: {
  datos: DatosCorporales;
  onCambiar: (d: DatosCorporales) => void;
  pedirSexo?: boolean;
  pedirEdad?: boolean;
}) {
  const { errores } = leerDatos(datos, pedirEdad);
  const set = (k: keyof DatosCorporales) => (t: string) => onCambiar({ ...datos, [k]: t });

  return (
    <>
      {pedirSexo && (
        <Segmentado
          label="Sexo"
          opciones={[
            { id: 'hombre', texto: 'Hombre' },
            { id: 'mujer', texto: 'Mujer' },
          ]}
          valor={datos.sexo}
          onCambiar={(s) => onCambiar({ ...datos, sexo: s })}
        />
      )}
      <FilaCampos>
        {pedirEdad && (
          <Columna>
            <CampoNumero label="Edad" value={datos.edad} onChangeText={set('edad')} placeholder="17" sufijo="años" error={errores.edad} maxLength={3} />
          </Columna>
        )}
        <Columna>
          <CampoNumero label="Peso" value={datos.peso} onChangeText={set('peso')} placeholder="58" sufijo="kg" error={errores.peso} maxLength={5} />
        </Columna>
        <Columna>
          <CampoNumero label="Estatura" value={datos.altura} onChangeText={set('altura')} placeholder="163" sufijo="cm" error={errores.altura} maxLength={5} />
        </Columna>
      </FilaCampos>
    </>
  );
}
