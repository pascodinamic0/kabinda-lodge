-- Insert initial privacy policy content
INSERT INTO website_content (section, language, content) VALUES 
('privacy_policy', 'en', '{
  "title": "Privacy Policy",
  "lastUpdated": "2024-01-01",
  "content": "This is our privacy policy content. We respect your privacy and are committed to protecting your personal data."
}'),
('privacy_policy', 'fr', '{
  "title": "Politique de Confidentialité", 
  "lastUpdated": "2024-01-01",
  "content": "Ceci est le contenu de notre politique de confidentialité. Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles."
}'),
('privacy_policy', 'es', '{
  "title": "Política de Privacidad",
  "lastUpdated": "2024-01-01", 
  "content": "Este es el contenido de nuestra política de privacidad. Respetamos su privacidad y nos comprometemos a proteger sus datos personales."
}'),
('privacy_policy', 'pt', '{
  "title": "Política de Privacidade",
  "lastUpdated": "2024-01-01",
  "content": "Este é o conteúdo da nossa política de privacidade. Respeitamos sua privacidade e estamos comprometidos em proteger seus dados pessoais."
}'),
('privacy_policy', 'ar', '{
  "title": "سياسة الخصوصية",
  "lastUpdated": "2024-01-01",
  "content": "هذا هو محتوى سياسة الخصوصية الخاصة بنا. نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية."
}');

-- Insert initial terms of service content  
INSERT INTO website_content (section, language, content) VALUES
('terms_of_service', 'en', '{
  "title": "Terms of Service",
  "lastUpdated": "2024-01-01",
  "content": "These are our terms of service. By using our service, you agree to these terms."
}'),
('terms_of_service', 'fr', '{
  "title": "Conditions d''Utilisation",
  "lastUpdated": "2024-01-01", 
  "content": "Voici nos conditions d''utilisation. En utilisant notre service, vous acceptez ces conditions."
}'),
('terms_of_service', 'es', '{
  "title": "Términos de Servicio",
  "lastUpdated": "2024-01-01",
  "content": "Estos son nuestros términos de servicio. Al usar nuestro servicio, usted acepta estos términos."
}'),
('terms_of_service', 'pt', '{
  "title": "Termos de Serviço", 
  "lastUpdated": "2024-01-01",
  "content": "Estes são nossos termos de serviço. Ao usar nosso serviço, você concorda com estes termos."
}'),
('terms_of_service', 'ar', '{
  "title": "شروط الخدمة",
  "lastUpdated": "2024-01-01",
  "content": "هذه هي شروط الخدمة الخاصة بنا. باستخدام خدمتنا، فإنك توافق على هذه الشروط."
}');