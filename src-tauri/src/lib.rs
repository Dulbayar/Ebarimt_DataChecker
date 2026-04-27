use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn save_xlsx_with_folder_picker(bytes: Vec<u8>, filename: String) -> Result<String, String> {
  let selected_folder = rfd::FileDialog::new()
    .set_title("Select destination folder")
    .pick_folder()
    .ok_or_else(|| "Folder selection cancelled".to_string())?;

  let safe_filename = if filename.trim().is_empty() {
    "ebarimt_lookup.xlsx".to_string()
  } else {
    filename
  };

  let file_path: PathBuf = selected_folder.join(safe_filename);
  fs::write(&file_path, bytes).map_err(|e| format!("Failed to write file: {e}"))?;

  Ok(file_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![save_xlsx_with_folder_picker])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
