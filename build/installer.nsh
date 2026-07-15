!include nsDialogs.nsh

Var ShortcutDesktopCheckbox
Var ShortcutStartMenuCheckbox
Var CreateDesktopShortcutChoice
Var CreateStartMenuShortcutChoice

!macro customInit
  StrCpy $CreateDesktopShortcutChoice ${BST_UNCHECKED}
  StrCpy $CreateStartMenuShortcutChoice ${BST_CHECKED}
  DetailPrint "Closing existing Crossline CSCA Practice Client instances..."
  nsExec::ExecToLog 'taskkill /IM "Crossline CSCA Practice Client.exe" /T /F'
  Sleep 1500
!macroend

!ifndef BUILD_UNINSTALLER
!macro customPageAfterChangeDir
  Page custom CrosslineShortcutOptionsPage CrosslineShortcutOptionsLeave
!macroend

Function CrosslineShortcutOptionsPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 24u "You can change these shortcuts later by reinstalling the app."
  Pop $0
  ${NSD_CreateCheckbox} 0 34u 100% 12u "Create a Desktop shortcut"
  Pop $ShortcutDesktopCheckbox
  ${NSD_SetState} $ShortcutDesktopCheckbox $CreateDesktopShortcutChoice
  ${NSD_CreateCheckbox} 0 54u 100% 12u "Create a Start Menu shortcut and uninstall shortcut"
  Pop $ShortcutStartMenuCheckbox
  ${NSD_SetState} $ShortcutStartMenuCheckbox $CreateStartMenuShortcutChoice
  nsDialogs::Show
FunctionEnd

Function CrosslineShortcutOptionsLeave
  ${NSD_GetState} $ShortcutDesktopCheckbox $CreateDesktopShortcutChoice
  ${NSD_GetState} $ShortcutStartMenuCheckbox $CreateStartMenuShortcutChoice
FunctionEnd
!endif

!macro customCheckAppRunning
  DetailPrint "Skipping broad app-running check; targeted Crossline process close already completed."
!macroend

!macro customUnInstallCheck
  IfErrors 0 +3
    DetailPrint "Previous uninstaller could not be launched. Continuing with repair install."
    ClearErrors
    Return

  ${if} $R0 != 0
    DetailPrint "Previous uninstaller exited with code $R0. Continuing with repair install."
    StrCpy $R0 0
    ClearErrors
  ${endif}
!macroend

!macro customUnInstallCheckCurrentUser
  !insertmacro customUnInstallCheck
!macroend

!macro customInstall
  IfSilent +1 +3
  DetailPrint "Silent update detected; preserving existing shortcuts."
  Return

  ${if} $installMode == "all"
    StrCpy $0 "/allusers"
  ${else}
    StrCpy $0 "/currentuser"
  ${endif}
  Delete "$DESKTOP\${SHORTCUT_NAME}.lnk"
  !ifdef MENU_FILENAME
    Delete "$SMPROGRAMS\${MENU_FILENAME}\${SHORTCUT_NAME}.lnk"
    Delete "$SMPROGRAMS\${MENU_FILENAME}\Uninstall Crossline CSCA Practice.lnk"
  !else
    Delete "$SMPROGRAMS\${SHORTCUT_NAME}.lnk"
    Delete "$SMPROGRAMS\Uninstall Crossline CSCA Practice.lnk"
  !endif

  ${if} $CreateDesktopShortcutChoice == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\${SHORTCUT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 "" "" "${APP_DESCRIPTION}"
  ${endif}

  ${if} $CreateStartMenuShortcutChoice == ${BST_CHECKED}
    !ifdef MENU_FILENAME
      CreateDirectory "$SMPROGRAMS\${MENU_FILENAME}"
      CreateShortCut "$SMPROGRAMS\${MENU_FILENAME}\${SHORTCUT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 "" "" "${APP_DESCRIPTION}"
      CreateShortCut "$SMPROGRAMS\${MENU_FILENAME}\Uninstall Crossline CSCA Practice.lnk" "$INSTDIR\${UNINSTALL_FILENAME}" "$0" "$INSTDIR\${UNINSTALL_FILENAME}" 0 "" "" "Uninstall Crossline CSCA Practice Client"
    !else
      CreateShortCut "$SMPROGRAMS\${SHORTCUT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 "" "" "${APP_DESCRIPTION}"
      CreateShortCut "$SMPROGRAMS\Uninstall Crossline CSCA Practice.lnk" "$INSTDIR\${UNINSTALL_FILENAME}" "$0" "$INSTDIR\${UNINSTALL_FILENAME}" 0 "" "" "Uninstall Crossline CSCA Practice Client"
    !endif
  ${endif}
!macroend

!macro customUnInstall
  !ifdef MENU_FILENAME
    Delete "$SMPROGRAMS\${MENU_FILENAME}\Uninstall Crossline CSCA Practice.lnk"
  !else
    Delete "$SMPROGRAMS\Uninstall Crossline CSCA Practice.lnk"
  !endif
!macroend
