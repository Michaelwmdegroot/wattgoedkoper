#!/usr/bin/env python3
"""Reproduce Hostinger's disabled PHP system() without storing any real credentials."""
import os
import pathlib
import stat
import subprocess
import tempfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
db=os.environ.get("WG_TEST_MYSQL_NAME","wattgoedkoper_ci")
user=os.environ.get("WG_TEST_MYSQL_USER","wattgoedkoper_ci")
pw=os.environ.get("WG_TEST_MYSQL_PASSWORD","ci-password-not-a-secret")
admin_pw="demo-only-admin-password-123456"

with tempfile.TemporaryDirectory(prefix="wg-hostinger-prompt-") as tmp:
    cmd=[
        "php","-d","disable_functions=system",
        "scripts/setup-mysql.php","--piped-input",
        "--origin=https://wattgoedkoper.nl",
        "--username=ciadmin","--database-host=127.0.0.1",
        "--private-dir="+tmp,
    ]
    result=subprocess.run(cmd,cwd=ROOT,input="\n".join((db,user,pw,admin_pw))+"\n",
                          capture_output=True,text=True,timeout=25,check=False)
    assert result.returncode==0, "Private MySQL installer failed: "+result.stderr.replace(pw,"[REDACTED]")
    config=pathlib.Path(tmp,"config.php")
    assert config.is_file(), "Expected private config file was not created"
    assert stat.S_IMODE(config.stat().st_mode)==0o600, "Private config permissions should be 0600"
    assert pw not in result.stdout+result.stderr, "Database password escaped into process output"
    assert admin_pw not in result.stdout+result.stderr, "Admin password escaped into process output"
    assert "configured:true" in result.stdout, "Expected installation confirmation"
    # Never print the private config content in CI output.
    print("Hostinger disabled-system setup: 5 checks passed (dummy CI credentials)")
