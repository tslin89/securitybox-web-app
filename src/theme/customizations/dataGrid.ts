// src/theme/customizations/dataGrid.ts
import type { Theme } from '@mui/material/styles';
import type { DataGridProComponents } from '@mui/x-data-grid-pro/themeAugmentation';
// import { gray } from '../..//theme/themePrimitives'; // note: primitives are in src/theme/themePrimitives.ts

export const dataGridCustomizations: DataGridProComponents<Theme> = {
  MuiDataGrid: {
    styleOverrides: {
      root: ({ theme }) => ({
        border: 'none',
        '--DataGrid-rowBorderColor': (theme.vars || theme).palette.divider,
        '& .MuiDataGrid-cell': {
          outline: 'none',
        },
      }),
      columnHeaders: ({ theme }) => ({
        borderBottom: `1px solid ${(theme.vars || theme).palette.divider}`,
        fontWeight: 600,
      }),
      row: {
        // You can tweak the default row height via CSS var
        '--DataGrid-rowHeight': '44px',
      },
      toolbarContainer: ({ theme }) => ({
        borderBottom: `1px solid ${(theme.vars || theme).palette.divider}`,
      }),
      footerContainer: ({ theme }) => ({
        borderTop: `1px solid ${(theme.vars || theme).palette.divider}`,
      }),
    },
    defaultProps: {
      density: 'standard',
      disableColumnMenu: true,
      rowHeight: 44,
      //headerHeight: 52,
    },
  },
};
