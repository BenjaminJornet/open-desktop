{
  "targets": [
    {
      "target_name": "printenvz",
      "type": "executable",
      "sources": [
        "src/printenvz.c"
      ],
      "include_dirs": [],
      "cflags": ["-std=c99"],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "OTHER_CFLAGS": ["-std=c99"],
            "MACOSX_DEPLOYMENT_TARGET": "10.7"
          }
        }]
      ]
    }
  ]
}
