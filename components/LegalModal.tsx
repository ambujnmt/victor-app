
import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
    type: 'privacy' | 'terms' | 'impressum';
    onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
    const renderContent = () => {
        switch (type) {
            case 'privacy':
                return (
                    <div className="space-y-6 text-sm text-gray-300">
                        <h2 className="text-2xl font-black text-white uppercase italic">DATENSCHUTZERKLÄRUNG – HEY LIFE</h2>
                        
                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">1. Verantwortlicher</h3>
                            <p>Hey Kirche e.V.<br/>Owiesenstraße 66<br/>22177 Hamburg<br/>E-Mail: office@heychurch.de</p>
                            <p className="mt-2 font-bold">Vorstand:</p>
                            <p>Michael Wenzel, Andreas Kebernik, Andreas Stein, Victor Akko</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">2. Ziel & Ausrichtung der App</h3>
                            <p>Hey Life ist eine App zur:</p>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>geistlichen Inspiration</li>
                                <li>theologischen Bildung</li>
                                <li>persönlichen Reflexion</li>
                            </ul>
                            <p className="mt-2 italic">Die Nutzung ist freiwillig und offen für alle.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">3. Verarbeitete Daten</h3>
                            <p className="font-bold">Bei Registrierung:</p>
                            <ul className="list-disc ml-5 mb-2">
                                <li>Name oder Nickname</li>
                                <li>E-Mail-Adresse</li>
                                <li>Passwort (verschlüsselt)</li>
                            </ul>
                            <p className="font-bold">Bei Nutzung:</p>
                            <ul className="list-disc ml-5 mb-2">
                                <li>Lernfortschritt</li>
                                <li>abgeschlossene Sessions</li>
                                <li>Challenges & Reflections</li>
                            </ul>
                            <p className="font-bold">Technisch:</p>
                            <ul className="list-disc ml-5">
                                <li>Geräteinformationen</li>
                                <li>pseudonymisierte IP-Adresse</li>
                                <li>Fehler- & Logdaten</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">4. Journal-Funktion</h3>
                            <p>Die Journal-Funktion dient der persönlichen geistlichen Reflexion.</p>
                            <p className="mt-2 text-[rgb(255_117_93)] font-bold">🚫 Bitte keine sensiblen Daten eingeben, insbesondere:</p>
                            <ul className="list-disc ml-5 mb-2">
                                <li>Gesundheitsdaten</li>
                                <li>therapeutische Inhalte</li>
                                <li>intime oder hochvertrauliche Informationen</li>
                            </ul>
                            <p className="font-bold">📌 Journal-Einträge:</p>
                            <ul className="list-disc ml-5">
                                <li>werden nicht gelesen oder bewertet</li>
                                <li>nicht an Dritte weitergegeben</li>
                                <li>nicht für Profiling oder Werbung genutzt</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">5. Tracking & Analyse</h3>
                            <p>Hey Life verwendet: <span className="font-bold">Firebase Analytics</span></p>
                            <p className="mt-2 font-bold">Zweck:</p>
                            <ul className="list-disc ml-5">
                                <li>App-Stabilität</li>
                                <li>Funktionsverbesserung</li>
                                <li>anonyme Nutzungsstatistiken</li>
                            </ul>
                            <p className="mt-2">➡️ Keine personalisierte Werbung<br/>➡️ Keine Weitergabe zu Marketingzwecken</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">6. Drittanbieter & Server</h3>
                            <p>Die App nutzt Dienste von <span className="font-bold">Google Firebase</span>. Datenverarbeitung kann außerhalb der EU stattfinden. Es gelten die EU-Standardvertragsklauseln gemäß Art. 46 DSGVO.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">7. Rechtsgrundlagen</h3>
                            <p>Art. 6 Abs. 1 lit. a DSGVO – Einwilligung<br/>Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung<br/>Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">8. Rechte der Nutzer</h3>
                            <p>Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Widerruf deiner Einwilligung.</p>
                            <p className="mt-2">📧 Kontakt: office@heychurch.de</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">9. Löschung des Kontos</h3>
                            <p>Jederzeit möglich. Alle personenbezogenen Daten werden gelöscht. Umsetzung innerhalb von max. 30 Tagen.</p>
                        </section>
                    </div>
                );
            case 'terms':
                return (
                    <div className="space-y-6 text-sm text-gray-300">
                        <h2 className="text-2xl font-black text-white uppercase italic">NUTZUNGSBEDINGUNGEN – HEY LIFE</h2>
                        
                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">1. Zweck</h3>
                            <p>Hey Life dient geistlicher Inspiration und Bildung. Die Inhalte stellen keine medizinische, psychologische oder therapeutische Beratung dar.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">2. Eigenverantwortung</h3>
                            <p>Die Nutzung erfolgt auf eigene Verantwortung. Geistliche Impulse ersetzen keine persönliche Begleitung.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">3. Verhalten & Inhalte</h3>
                            <p className="font-bold">Untersagt sind:</p>
                            <ul className="list-disc ml-5">
                                <li>Missbrauch der App</li>
                                <li>rechtswidrige Inhalte</li>
                                <li>Manipulation oder Belästigung</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">4. Haftung</h3>
                            <p>Hey Kirche e.V. haftet im gesetzlichen Rahmen nur für Vorsatz und grobe Fahrlässigkeit.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-[rgb(251_191_36)] mb-2">5. Änderungen</h3>
                            <p>Inhalte und Funktionen können jederzeit weiterentwickelt werden.</p>
                        </section>
                    </div>
                );
            case 'impressum':
                return (
                    <div className="space-y-6 text-sm text-gray-300 text-center py-8">
                        <h2 className="text-2xl font-black text-white uppercase italic mb-4">IMPRESSUM</h2>
                        <p className="text-lg font-bold text-white">Hey Kirche e.V.</p>
                        <p>Owiesenstraße 66<br/>22177 Hamburg</p>
                        <p className="mt-4">📧 <a href="mailto:office@heychurch.de" className="text-[rgb(59_130_246)] underline">office@heychurch.de</a></p>
                        
                        <div className="mt-8 border-t border-gray-700 pt-8">
                            <p className="font-black text-xs uppercase tracking-widest text-gray-500 mb-4">Vorstand</p>
                            <ul className="space-y-2 font-bold text-white uppercase italic">
                                <li>Michael Wenzel</li>
                                <li>Andreas Kebernik</li>
                                <li>Andreas Stein</li>
                                <li>Victor Akko</li>
                            </ul>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-[rgb(19,54,102)]/98 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col relative border border-white/10 overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 p-2 rounded-full z-20">
                    <X size={20} />
                </button>
                <div className="p-8 md:p-12 overflow-y-auto scrollbar-hide">
                    {renderContent()}
                </div>
                <div className="p-8 border-t border-gray-700 bg-gray-900/50 flex justify-center">
                    <button onClick={onClose} className="bg-white text-[rgb(19_54_102)] font-black py-4 px-12 rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-transform active:scale-95 shadow-xl">
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};
