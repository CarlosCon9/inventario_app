import apiClient from './api';

// --- Función para generar timestamp ---
const getTimestamp = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
};

const downloadFile = (response, defaultFilename) => {
    const header = response.headers['content-disposition'];
    const filename = header 
        ? header.split('filename=')[1].replace(/"/g, '') 
        : `${defaultFilename.replace('.xlsx', '')}_${getTimestamp()}.xlsx`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export default {
    getDashboardStats() { return apiClient.get('/reportes/dashboard-stats'); },
    getBajoStock() { return apiClient.get('/reportes/bajo-stock'); },
    getMovimientosRecientes() { return apiClient.get('/reportes/movimientos-recientes'); },
    
    getReporteStockBajo(exportExcel = false) {
        if (exportExcel) {
            return apiClient.get('/reportes/stock-bajo-detallado', { params: { export: 'excel' }, responseType: 'blob' })
                .then(response => downloadFile(response, 'Reporte_Stock_Bajo.xlsx'));
        }
        return apiClient.get('/reportes/stock-bajo-detallado');
    },
    
    getReporteInventario(exportExcel = false) {
        if (exportExcel) {
            return apiClient.get('/reportes/inventario-completo', { params: { export: 'excel' }, responseType: 'blob' })
                .then(response => downloadFile(response, 'Reporte_Inventario_Completo.xlsx'));
        }
        return apiClient.get('/reportes/inventario-completo');
    },
    
    getReporteMovimientos(filters, exportExcel = false) {
        const config = { params: { ...filters } };
        if (exportExcel) {
            config.params.export = 'excel';
            config.responseType = 'blob';
            return apiClient.get('/reportes/movimientos', config)
                .then(response => downloadFile(response, 'Reporte_Movimientos.xlsx'));
        }
        return apiClient.get('/reportes/movimientos', config);
    }
};
