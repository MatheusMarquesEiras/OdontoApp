// Camada Rust (fina). No MVP mock, apenas inicializa a janela.
// Evolução prevista (PLANEJAMENTO.md Etapa 1): abrir o SQLite com SQLCipher e
// expor comandos de CRUD via `invoke_handler`.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
