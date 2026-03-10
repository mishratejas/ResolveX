import React from 'react';
import { Shield, Mail, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-14 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                Resolve<span className="text-cyan-400">X</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Connecting communities with solutions. Making issue resolution simple,
              transparent, and efficient. Your voice, our priority.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {['Help Center', 'Community Guidelines', 'Privacy Policy', 'Terms of Service'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Creators */}
          <div id="contact">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Created By</h3>
            <div className="space-y-5">
              {[
                { name: 'Vaibhav Kumar Shashwat', email: 'vaibhavkshashwat2713@gmail.com' },
                { name: 'Tejas Mishra', email: 'tejasmishra040907@gmail.com' },
              ].map((creator) => (
                <div key={creator.name} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {creator.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{creator.name}</p>
                    <a
                      href={`mailto:${creator.email}`}
                      className="text-gray-400 hover:text-cyan-400 text-xs flex items-center gap-1 mt-0.5 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      {creator.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} ResolveX. All rights reserved.</p>
          <p className="text-gray-600">Built with ❤️ to empower communities.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
