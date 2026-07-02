import ExcelJS from 'exceljs';
import prisma from '../../database';
import { createRecord } from './records.service';

interface ImportedRow {
  tipo: string;
  empresa: string;
  nit?: string;
  ciudad?: string;
  comercialNombre?: string;
  estadoProspecto?: string;
  estadoCliente?: string;
  fecha?: string;
  observaciones?: string;
  servicios?: string;
  valor?: number;
}

export async function importRecordsFromExcel(buffer: Buffer): Promise<{
  imported: number;
  errors: string[];
}> {
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw Object.assign(new Error('El archivo Excel no tiene hojas'), { statusCode: 400 });
  }

  const comerciales = await prisma.comercial.findMany({ select: { id: true, nombre: true } });
  const comercialMap = new Map(comerciales.map((c) => [c.nombre.toLowerCase(), c.id]));

  const headers: string[] = [];
  const rows: ImportedRow[] = [];
  const errors: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        headers.push(String(cell.value ?? '').toLowerCase().trim());
      });
      return;
    }

    const rowData: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        rowData[header] = cell.value;
      }
    });

    rows.push(rowData as unknown as ImportedRow);
  });

  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    try {
      if (!row.empresa || !row.tipo) {
        errors.push(`Fila ${rowNum}: empresa y tipo son requeridos`);
        continue;
      }

      const tipo = String(row.tipo).toLowerCase();
      if (tipo !== 'prospecto' && tipo !== 'cliente') {
        errors.push(`Fila ${rowNum}: tipo debe ser "prospecto" o "cliente"`);
        continue;
      }

      let comercialId: string;
      if (row.comercialNombre) {
        const found = comercialMap.get(String(row.comercialNombre).toLowerCase());
        if (!found) {
          errors.push(`Fila ${rowNum}: Comercial "${row.comercialNombre}" no encontrado`);
          continue;
        }
        comercialId = found;
      } else {
        const first = comerciales[0];
        if (!first) {
          errors.push(`Fila ${rowNum}: No hay comerciales registrados`);
          continue;
        }
        comercialId = first.id;
      }

      let servicios: string[] = [];
      if (row.servicios) {
        servicios = String(row.servicios)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const fecha = row.fecha ? new Date(String(row.fecha)) : new Date();
      if (isNaN(fecha.getTime())) {
        errors.push(`Fila ${rowNum}: fecha inválida`);
        continue;
      }

      const valor = row.valor ? Number(row.valor) : undefined;

      await createRecord({
        tipo,
        empresa: String(row.empresa),
        nit: row.nit ? String(row.nit) : undefined,
        ciudad: row.ciudad ? String(row.ciudad) : undefined,
        comercialId,
        fecha: fecha.toISOString(),
        estadoProspecto: row.estadoProspecto ? String(row.estadoProspecto) : undefined,
        estadoCliente: row.estadoCliente ? String(row.estadoCliente) : undefined,
        observaciones: row.observaciones ? String(row.observaciones) : undefined,
        servicios,
        ...(tipo === 'prospecto' && valor !== undefined ? { valorP: valor } : {}),
        ...(tipo === 'cliente' && valor !== undefined ? { valor } : {}),
      });
      imported++;
    } catch (err) {
      errors.push(`Fila ${rowNum}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  }

  return { imported, errors };
}
