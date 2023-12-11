import getpass
import secrets

import kadmin
import kubernetes as k8s

from .kadmin import Kadm
from .kubernetes import K8s
from .util import KtData

cluster = process.environ["CLUSTER_NAME"]
realm = process.environ["REALM"]
namespace = process.environ["NAMESPACE"]

print(f"Enrolling cluster {cluster} in {realm}")
user = input("ACS admin user: ")
passwd = getpass.getpass(prompt="Password: ")
kadm_h = kadmin.init_with_password(user, passwd)
kadm = Kadm(kadm=kadm_h)

k8s.config.load_incluster_config()
k8o = K8s()

kt = KtData(contents=None)
with kt.kt_name() as ktname:
    kadm.create_keytab([f"op1krbkeys/{cluster}"], ktname)
k8o.update_secret(ns=namespace, name="krb-keys-keytabs",
    key="client", value=kt.contents)

fluxusr = f"op1flux/{cluster}"
fluxpw = secrets.token_urlsafe()
kadm.set_password(fluxusr, fluxpw)
k8o.update_secret(ns=namespace, name="flux-secrets", key="password", 
    value=fluxpw.encode())
k8o.update_secret(ns=namespace, name="flux-secrets", key="username",
    value=fluxusr.encode())
