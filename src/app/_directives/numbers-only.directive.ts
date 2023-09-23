import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { Utility } from '../_services/utility';

@Directive({
  selector: '[numbersOnly]'
})
export class NumbersOnlyDirective implements OnInit {
  @Input()
  inputValue!: number;

  @Input()
  allowDecimals: boolean = true;

  @Input()
  allowSign: boolean = true;

  @Input()
  decimalSeparator: string = '.';

  @Input()
  locale: string = '';

  @Input()
  decimalPlaces: number = 2;

  // --------------------------------------
  //  Regular expressions
  integerUnsigned: string = '^[0-9]*$';
  integerSigned: string = '^-?[0-9]+$';
  decimalUnsigned: string = '^[0-9]+(.[0-9]+)?$';
  decimalSigned: string = '^-?[0-9]+(.[0-9]+)?$';

  /**
   * Class constructor
   * @param hostElement
   */
  constructor(private hostElement: ElementRef) { }

  ngOnInit(): void {
    this.setNumberValue(this.inputValue);
  }

  /**
   * Event handler for host's change event
   * @param e
   */
  @HostListener('change', ['$event'])
  onChange(e: Event) {
    this.validateValue(this.hostElement.nativeElement.value);
  }

  /**
   * Event handler for host's paste event
   * @param e
   */
  @HostListener('paste', ['$event'])
  onPaste(e: ClipboardEvent) {
    // get and validate data from clipboard
    let value = e.clipboardData!.getData('text/plain');
    this.validateValue(value);
    e.preventDefault();
  }

  /**
   * Event handler for host's keydown event
   * @param event
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(e: any) {
    let cursorPosition: number = e.target['selectionStart'];
    let originalValue: string = e.target['value'];
    let key: string = this.getName(e);
    let controlOrCommand = e.ctrlKey === true || e.metaKey === true;
    let signExists = originalValue.includes('-');
    let separatorExists = originalValue.includes(this.decimalSeparator);

    // allowed keys apart from numeric characters
    let allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Escape', 'Tab'];

    // when decimals are allowed, add
    // decimal separator to allowed codes when
    // its position is not close to the the sign (-. and .-)
    let separatorIsCloseToSign = signExists && cursorPosition <= 1;
    if (this.allowDecimals && !separatorIsCloseToSign && !separatorExists) {
      if (this.decimalSeparator == '.') allowedKeys.push('.');
      else allowedKeys.push(',');
    }

    // when minus sign is allowed, add its
    // key to allowed key only when the
    // cursor is in the first position, and
    // first character is different from
    // decimal separator
    let firstCharacterIsSeparator =
      originalValue.charAt(0) != this.decimalSeparator;
    if (
      this.allowSign &&
      !signExists &&
      firstCharacterIsSeparator &&
      cursorPosition == 0
    ) {
      allowedKeys.push('-');
    }

    // allow some non-numeric characters
    if (
      allowedKeys.indexOf(key) != -1 ||
      // Allow: Ctrl+A and Command+A
      (key == 'a' && controlOrCommand) ||
      // Allow: Ctrl+C and Command+C
      (key == 'c' && controlOrCommand) ||
      // Allow: Ctrl+V and Command+V
      (key == 'v' && controlOrCommand) ||
      // Allow: Ctrl+X and Command+X
      (key == 'x' && controlOrCommand)
    ) {
      // let it happen, don't do anything
      return;
    }

    // allow number characters only
    let isNumber = new RegExp(this.integerUnsigned).test(key);
    if (isNumber) return;
    else e.preventDefault();
  }

  /**
   * Test whether value is a valid number or not
   * @param value
   */
  validateValue(value: string): void {
    // choose the appropiate regular expression
    let regex!: string;
    if (!this.allowDecimals && !this.allowSign) regex = this.integerUnsigned;
    if (!this.allowDecimals && this.allowSign) regex = this.integerSigned;
    if (this.allowDecimals && !this.allowSign) regex = this.decimalUnsigned;
    if (this.allowDecimals && this.allowSign) regex = this.decimalSigned;

    // when a numbers begins with a decimal separator,
    // fix it adding a zero in the beginning
    let firstCharacter = value.charAt(0);
    if (firstCharacter == this.decimalSeparator) value = 0 + value;

    // when a numbers ends with a decimal separator,
    // fix it adding a zero in the end
    let lastCharacter = value.charAt(value.length - 1);
    if (lastCharacter == this.decimalSeparator) value = value + 0;
  }

  /**
   * Get key's name
   * @param e
   */
  getName(e: KeyboardEvent): string {
    if (e.key) {
      return e.key;
    } else {
      // for old browsers
      if (e.keyCode && String.fromCharCode) {
        switch (e.keyCode) {
          case 8:
            return 'Backspace';
          case 9:
            return 'Tab';
          case 27:
            return 'Escape';
          case 37:
            return 'ArrowLeft';
          case 39:
            return 'ArrowRight';
          case 188:
            return ',';
          case 190:
            return '.';
          case 109:
            return '-'; // minus in numbpad
          case 173:
            return '-'; // minus in alphabet keyboard in firefox
          case 189:
            return '-'; // minus in alphabet keyboard in chrome
          default:
            return String.fromCharCode(e.keyCode);
        }
      }
      else return '';
    }
  }

  @HostListener("focusout", ["$event.target.value"])
  onBlur(value: number) {
    this.setNumberValue(value);
  }

  private setNumberValue(value: number) {
    const newValue = Utility.formatNumberViaLocale(value, this.locale);

    if (newValue || newValue === 0) {
      this.hostElement.nativeElement.value = Number(newValue).toLocaleString(
        this.locale, this.allowDecimals ? {
          minimumFractionDigits: this.decimalPlaces,
          maximumFractionDigits: this.decimalPlaces
        } : {});
    }
    else {
      this.hostElement.nativeElement.value = '';
    }
  }
}