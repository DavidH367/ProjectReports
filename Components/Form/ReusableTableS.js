import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
} from "@nextui-org/react";
import { EditIcon } from "../Icons/EditIcon";
import { DeleteIcon } from "../Icons/DeleteIcon";
import { EyeIcon } from "../Icons/EyeIcon";
import React, { useState, useEffect } from 'react';
import { Pagination, PaginationItem, PaginationCursor } from "@nextui-org/react";
import { useAsyncList } from "@react-stately/data";

const statusColorMap = {
  active: "success",
  removed: "danger",
  paused: "warning",
};
const ITEMS_PER_PAGE = 10; // Cantidad de elementos por página

const ReusableTable = ({ data, columns }) => {

  const [currentPage, setCurrentPage] = React.useState(1);
  // Calcula el índice de inicio y fin para mostrar los elementos en la página actual
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = currentPage * ITEMS_PER_PAGE;
  const itemsToShow = data.slice(startIndex, endIndex);
  const pages = Math.ceil(data.length / ITEMS_PER_PAGE);

  const [sorting, setSorting] = useState({
    column: null,
    direction: "asc", // Puedes establecer "asc" (ascendente) como valor predeterminado
  });



  const handleColumnClick = (field) => {
    if (field === sorting.column) {
      // Si se hizo clic en la misma columna, cambia la dirección de clasificación
      setSorting({
        ...sorting,
        direction: sorting.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // Si se hizo clic en una columna diferente, cambia la columna y restablece la dirección de clasificación a "asc"
      setSorting({
        column: field,
        direction: "asc",
      });
    }
  };

  const onNextPage = React.useCallback(() => {
    if (currentPage < pages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return (
    <div>
      <Table aria-label="Example table with custom cells, pagination and sorting"
        isHeaderSticky
        // classNames={{
        //   wrapper: "max-h-[382px]",
        // }}
        topContentPlacement="outside"
      >
        <TableHeader>
          {columns.map((column, index) => (
            <TableColumn
              align={index === "actions" ? "center" : "start"}
              allowsSorting={index.sortable}

              key={index}
              className={`font-bold text-sm w-${100 / columns.length}/10`}
              onClick={() => handleColumnClick(column.field)}
              // Cambia el estilo para indicar la dirección de clasificación actual
              style={{ cursor: "pointer", textDecoration: column.field === sorting.column ? "underline" : "none" }}

            >
              {column.title}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {itemsToShow
            .sort((a, b) => {
              if (sorting.column) {
                const aValue = a[sorting.column];
                const bValue = b[sorting.column];

                // Verificar si los valores son cadenas antes de ordenar
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                  if (sorting.direction === "asc") {
                    return aValue.localeCompare(bValue);
                  } else {
                    return bValue.localeCompare(aValue);
                  }
                } else {
                  // Si los valores no son cadenas, no los ordenes y devuelve 0
                  return 0;
                }
              }
              return 0;
            })
            .map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, columnIndex) => {
                  let cellValue = row[column.field];

                  if (column.field === 'total') {
                    // Formatea la columna 'value' como moneda
                    cellValue = parseFloat(row[column.field]).toLocaleString("es-ES", {
                      style: "currency",
                      currency: "HNL",
                      minimumFractionDigits: 2,
                    })
                  }

                  if (column.field === 'capital') {
                    // Formatea la columna 'value' como moneda
                    cellValue = parseFloat(row[column.field]).toLocaleString("es-ES", {
                      style: "currency",
                      currency: "HNL",
                      minimumFractionDigits: 2,
                    })
                  }

                  if (column.field === 'budget') {
                    // Formatea la columna 'value' como moneda
                    cellValue = parseFloat(row[column.field]).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                    })
                  }

                  if (column.field === 'pending') {
                    // Formatea la columna 'value' como moneda
                    cellValue = parseFloat(row[column.field]).toLocaleString("es-ES", {
                      style: "currency",
                      currency: "HNL",
                      minimumFractionDigits: 2,
                    })
                  }

                  if (column.field === 'value') {
                    // Formatea la columna 'value' como moneda
                    cellValue = parseFloat(row[column.field]).toLocaleString("es-ES", {
                      style: "currency",
                      currency: "HNL",
                      minimumFractionDigits: 2,
                    })
                  }
                  if (column.field === 'status') {
                    // Render status
                    return (
                      <TableCell key={columnIndex}>
                        <Chip className="capitalize" color={statusColorMap[row.status]} size="md" variant="flat">
                          {cellValue}
                        </Chip>
                      </TableCell>
                    );
                  }

                  if (column.field === 'logo_url') {
                    // Render image for logo_url
                    return (
                      <TableCell key={columnIndex}>
                        <img src={cellValue} alt={`Logo for ${row.name || 'Unknown'}`} />
                      </TableCell>
                    );
                  }


                  return <TableCell key={columnIndex}>
                    {
                      column.field === 'date' && row[column.field]
                        ? row[column.field].toDate().toLocaleString('es-ES', options) // Convierte la marca de tiempo en una cadena formateada
                        : cellValue}


                  </TableCell>
                })}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400 ">
        </span>
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={currentPage}
            total={pages} // Calcula el total de páginas
            onChange={(newPage) => {
              setCurrentPage(newPage);
            }}
          />
        </div>
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button isDisabled={startIndex === 1} size="sm" variant="flat" onPress={onPreviousPage}>
            Previous
          </Button>
          <Button isDisabled={endIndex === 1} size="sm" variant="flat" onPress={onNextPage}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReusableTable;