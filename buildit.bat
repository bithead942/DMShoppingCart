@echo off
echo *******************
echo *** DELETE DIST ***
echo *******************
rmdir /s /q "C:\Users\gregs\DMShoppingCart\dist"
echo **********************
echo *** STARTING BUILD ***
echo **********************
call npm run build
echo ************************
echo *** STARTING PACKAGE ***
echo ************************
call npm run package
echo ***************
echo *** RUNNING ***
echo ***************
call npm start