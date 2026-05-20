# backend/app/services/sms.py
import json
import secrets
from aliyunsdkcore.client import AcsClient
from aliyunsdkdysmsapi.request.v20170525.SendSmsRequest import SendSmsRequest
from app.config import settings

def generate_code() -> str:
    return f"{secrets.randbelow(900000) + 100000}"

def send_sms_code(phone: str, code: str) -> None:
    client = AcsClient(settings.ALIYUN_SMS_KEY, settings.ALIYUN_SMS_SECRET, "cn-hangzhou")
    request = SendSmsRequest()
    request.set_PhoneNumbers(phone)
    request.set_SignName(settings.ALIYUN_SMS_SIGN)
    request.set_TemplateCode(settings.ALIYUN_SMS_TEMPLATE)
    request.set_TemplateParam(json.dumps({"code": code}))
    response = client.do_action_with_exception(request)
    result = json.loads(response)
    if result.get("Code") != "OK":
        raise Exception(f"SMS failed: {result.get('Message')}")
