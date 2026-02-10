import React from 'react';

const Footer = () => {
  const footerLinks = {
    support: ['Help Center', 'Community Guidelines', 'Privacy Policy', 'Terms of Service'],
    resources: ['Blog', 'Case Studies', 'Documentation', 'API'],
  };

  const socialIcons = ['fa-twitter', 'fa-facebook-f', 'fa-linkedin-in', 'fa-instagram'];

  return (
    <footer className="bg-gray-800 text-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">About ResolveX</h3>
            <p className="text-gray-400 mb-4">
              ResolveX connects communities with solutions, making issue resolution simple, transparent, and efficient.
            </p>
            <div className="flex space-x-4">
              {socialIcons.map((icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className={`fab ${icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div id="contact">
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">1234 Innovation Drive</li>
              <li className="text-gray-400">San Francisco, CA 94107</li>
              <li className="text-gray-400">contact@resolvex.com</li>
              <li className="text-gray-400">+1 (555) 123-4567</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; 2023 ResolveX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;