#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // M1 wires this: focus main window + load argv files into the playlist
    // (single-instance requirement, 04-edge-cases.md §16).
    .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
    .plugin(tauri_plugin_libmpv::init())
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
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
